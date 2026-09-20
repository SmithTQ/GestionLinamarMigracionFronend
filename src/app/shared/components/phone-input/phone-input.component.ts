import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  forwardRef,
  signal,
} from '@angular/core';
import {
  AsYouType,
  CountryCode,
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
} from 'libphonenumber-js/min';

interface PhoneCountry {
  code: CountryCode;
  callingCode: string;
  label: string;
  flag: string;
}

const DEFAULT_COUNTRY: CountryCode = 'PE';
const COUNTRY_NAMES = createCountryNames();
const PHONE_COUNTRIES: PhoneCountry[] = getCountries()
  .map((code) => ({
    code,
    callingCode: getCountryCallingCode(code),
    label: COUNTRY_NAMES.of(code) ?? code,
    flag: countryFlag(code),
  }))
  .sort((left, right) => left.label.localeCompare(right.label, 'es'));

let phoneInputId = 0;

/**
 * International phone input that persists digits in WhatsApp-compatible format.
 * It supports Reactive Forms and signal-controlled values through `valueChanged`.
 */
@Component({
  selector: 'app-phone-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './phone-input.component.html',
  styleUrl: './phone-input.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => PhoneInputComponent),
      multi: true,
    },
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhoneInputComponent implements ControlValueAccessor, Validator {
  @Input() label = '';
  @Input() placeholder = 'Número de teléfono';
  @Input() required = false;
  @Input() id = `phone-input-${++phoneInputId}`;
  @Input() set value(value: string | null | undefined) {
    this.applyExternalValue(value ?? '');
  }
  @Input() set defaultCountry(country: CountryCode) {
    if (!PHONE_COUNTRIES.some((item) => item.code === country)) return;
    this.defaultCountryCode = country;
    if (!this.nationalNumber()) this.selectedCountry.set(country);
  }
  @Input() set disabled(disabled: boolean) {
    this.disabledByInput.set(disabled);
  }

  @Output() readonly valueChanged = new EventEmitter<string>();
  @Output() readonly validityChanged = new EventEmitter<boolean>();

  private defaultCountryCode: CountryCode = DEFAULT_COUNTRY;
  private readonly disabledByControl = signal(false);
  private readonly disabledByInput = signal(false);
  private lastEmittedValue: string | null = null;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;

  readonly countries = PHONE_COUNTRIES;
  readonly selectedCountry = signal<CountryCode>(DEFAULT_COUNTRY);
  readonly countrySearch = signal('');
  readonly isCountryMenuOpen = signal(false);
  readonly nationalNumber = signal('');
  readonly touched = signal(false);
  readonly isDisabled = computed(() => this.disabledByControl() || this.disabledByInput());
  readonly selectedCountryInfo = computed(
    () => PHONE_COUNTRIES.find((country) => country.code === this.selectedCountry()) ?? PHONE_COUNTRIES[0],
  );
  readonly filteredCountries = computed(() => {
    const query = normalizeSearch(this.countrySearch());
    if (!query) return PHONE_COUNTRIES;
    return PHONE_COUNTRIES.filter((country) =>
      normalizeSearch(`${country.label} ${country.code} ${country.callingCode}`).includes(query),
    );
  });
  readonly internationalValue = computed(() => {
    const number = digitsOnly(this.nationalNumber());
    return number ? `${getCountryCallingCode(this.selectedCountry())}${number}` : '';
  });
  readonly isValid = computed(() => {
    const value = this.internationalValue();
    if (!value) return !this.required;
    return parsePhoneNumberFromString(`+${value}`)?.isValid() ?? false;
  });
  readonly errorMessage = computed(() => {
    if (!this.touched() || this.isValid()) return null;
    return this.internationalValue()
      ? 'Ingresa un número válido para el país seleccionado.'
      : 'Este campo es obligatorio.';
  });

  writeValue(value: string | null): void {
    this.applyExternalValue(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabledByControl.set(disabled);
  }

  validate(_control: AbstractControl): ValidationErrors | null {
    if (!this.internationalValue()) return this.required ? { required: true } : null;
    return this.isValid() ? null : { phone: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  selectCountry(country: string): void {
    const countryCode = country as CountryCode;
    if (!PHONE_COUNTRIES.some((item) => item.code === countryCode)) return;
    this.selectedCountry.set(countryCode);
    this.nationalNumber.set(formatNationalNumber(this.nationalNumber(), countryCode));
    this.countrySearch.set('');
    this.isCountryMenuOpen.set(false);
    this.emitValue();
  }

  toggleCountryMenu(): void {
    if (this.isDisabled()) return;
    this.isCountryMenuOpen.update((isOpen) => !isOpen);
    this.countrySearch.set('');
  }

  updateCountrySearch(value: string): void {
    this.countrySearch.set(value);
  }

  updateNumber(value: string): void {
    this.nationalNumber.set(formatNationalNumber(value, this.selectedCountry()));
    this.emitValue();
  }

  markTouched(): void {
    this.touched.set(true);
    this.onTouched();
  }

  private setPhoneValue(value: string, notify: boolean): void {
    const rawValue = value.trim();
    const digits = digitsOnly(rawValue);
    const phone = rawValue.startsWith('+') || digits.length > 9
      ? parsePhoneNumberFromString(`+${digits}`)
      : undefined;

    if (phone?.country && PHONE_COUNTRIES.some((item) => item.code === phone.country)) {
      this.selectedCountry.set(phone.country);
      this.nationalNumber.set(formatNationalNumber(phone.nationalNumber, phone.country));
    } else {
      this.selectedCountry.set(this.defaultCountryCode);
      this.nationalNumber.set(formatNationalNumber(digits, this.defaultCountryCode));
    }

    if (notify) this.emitValue();
  }

  private applyExternalValue(value: string): void {
    // Reactive Forms and signal bindings reflect emitted values back into this
    // component. Ignore that echo so its international prefix is not parsed as
    // a new local number.
    if (value === this.lastEmittedValue) {
      this.lastEmittedValue = null;
      return;
    }
    this.lastEmittedValue = null;
    this.setPhoneValue(value, false);
  }

  private emitValue(): void {
    const value = this.internationalValue();
    this.lastEmittedValue = value;
    this.onChange(value);
    this.valueChanged.emit(value);
    this.validityChanged.emit(this.isValid());
    this.onValidatorChange();
  }
}

function createCountryNames(): Intl.DisplayNames {
  return new Intl.DisplayNames(['es'], { type: 'region' });
}

function countryFlag(country: CountryCode): string {
  return String.fromCodePoint(...[...country].map((character) => 127397 + character.charCodeAt(0)));
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function formatNationalNumber(value: string, country: CountryCode): string {
  return new AsYouType(country).input(digitsOnly(value));
}

function normalizeSearch(value: string): string {
  return value.trim().toLocaleLowerCase('es');
}
