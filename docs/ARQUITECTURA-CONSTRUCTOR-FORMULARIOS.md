# Arquitectura del constructor de formularios

## Responsabilidades

`CampaignFormBuilderModalComponent` es el componente smart del flujo. Conserva el estado de edición, coordina las peticiones HTTP, aplica las reglas de negocio y emite el resultado guardado.

Las secciones visuales son componentes standalone con `OnPush` y comunicación explícita mediante `@Input()` y `@Output()`:

- `CustomFormFieldModalComponent`: captura los datos de un campo personalizado.
- `CampaignProductsSectionComponent`: muestra el catálogo, productos seleccionados y acciones de edición.
- `CampaignAdditionalFieldsSectionComponent`: muestra y edita campos opcionales, opciones y orden.
- `CampaignFormPreviewComponent`: renderiza el resumen y la vista previa del formulario.

## Regla de comunicación

Los componentes hijos no acceden a servicios ni ejecutan peticiones. Emiten eventos tipados y el padre decide cómo validar, transformar y persistir cada cambio.

## Estado futuro

Una fachada dedicada podrá extraerse cuando el constructor incorpore más pasos o reglas. No se agrega una fachada artificial mientras el estado siga siendo específico de este flujo; la extracción debe mover de forma completa el estado, efectos y métodos relacionados, no duplicarlos.

## Validación

Los componentes tienen pruebas de contrato para sus inputs/outputs y la integración se valida con lint, compilación AOT y la suite de pruebas Angular.
