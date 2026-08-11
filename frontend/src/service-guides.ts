export type ServiceGuideKey =
  | 'streaming'
  | 'ai'
  | 'education'
  | 'vpn'
  | 'servers-domains'
  | 'telegram-bots'
  | 'memberships'
  | 'office'
  | 'online-orders';

export type ServiceGuide = {
  eyebrow: string;
  title: string;
  lead: string;
  accent: 'coral' | 'blue' | 'yellow' | 'mint' | 'ink';
  examples: string[];
  exampleNote: string;
  highlights: string[];
  modes: { label: string; title: string; description: string }[];
  steps: string[];
  note: string;
  ctaLabel: string;
  ctaHref: string;
};

export const serviceGuides: Record<ServiceGuideKey, ServiceGuide> = {
  streaming: {
    eyebrow: 'Entretenimiento',
    title: 'Streaming, con la modalidad clara desde el inicio.',
    lead: 'Te ayudamos a elegir una opción de entretenimiento según plataforma, duración, pantallas y tipo de acceso. Antes de pagar sabrás exactamente si recibirás un perfil, una invitación o una cuenta individual.',
    accent: 'coral',
    examples: ['Netflix', 'Disney+', 'Max', 'Prime Video'],
    exampleNote: 'Ejemplos sujetos a catálogo, región y disponibilidad.',
    highlights: ['Plazo y renovación visibles', 'Soporte si el acceso presenta un problema', 'Modalidad confirmada antes de transferir'],
    modes: [
      { label: 'Compartido', title: 'Perfil dentro de un plan', description: 'Acceso a un perfil o espacio de un plan administrado, únicamente cuando las condiciones del proveedor lo permiten. Se informan límites de pantallas y dispositivos.' },
      { label: 'Propio', title: 'Cuenta individual', description: 'Acceso exclusivo para una persona. Cuando la plataforma lo permite, se activa con el correo del cliente y no se comparte con terceros.' },
      { label: 'Invitación', title: 'Plan familiar o de equipo', description: 'Recibes una invitación oficial para unirte a un grupo permitido por la plataforma, conservando tu perfil y preferencias.' },
    ],
    steps: ['Eliges plataforma y modalidad disponible.', 'Confirmamos precio, duración, dispositivos y fecha de renovación.', 'Realizas la transferencia y validamos el comprobante.', 'Entregamos o activamos el acceso con sus instrucciones.'],
    note: 'Nunca se cambia una modalidad sin avisarte. No debes modificar contraseñas ni datos del titular en accesos compartidos. Las marcas pertenecen a sus respectivos propietarios.',
    ctaLabel: 'Ver membresías',
    ctaHref: '#comprar',
  },
  ai: {
    eyebrow: 'Herramientas de IA',
    title: 'IA para crear, investigar y trabajar mejor.',
    lead: 'Orientamos la elección según tu uso: redacción, análisis, imágenes, estudio, programación o productividad. La ficha de cada opción indicará límites, duración y forma de acceso.',
    accent: 'blue',
    examples: ['ChatGPT', 'Gemini', 'Claude', 'Canva AI'],
    exampleNote: 'La herramienta concreta depende del catálogo vigente.',
    highlights: ['Recomendación según tu objetivo', 'Configuración inicial acompañada', 'Condiciones y límites visibles'],
    modes: [
      { label: 'Individual', title: 'Acceso propio', description: 'Plan para uso personal, asociado a tu correo cuando el proveedor lo admite. Tus conversaciones y archivos permanecen separados.' },
      { label: 'Equipo', title: 'Asiento por invitación', description: 'Te incorporamos mediante una invitación a un espacio de trabajo con permisos y límites definidos por el proveedor.' },
      { label: 'Configurado', title: 'Herramienta lista para usar', description: 'Además del acceso, podemos dejar plantillas, instrucciones y un flujo básico adaptado a tu trabajo.' },
    ],
    steps: ['Nos dices para qué quieres usar IA.', 'Comparamos las opciones disponibles.', 'Confirmamos modalidad, límites y vigencia.', 'Activamos el acceso y te entregamos una guía breve.'],
    note: 'No usamos cuentas compartidas para herramientas que no lo permiten. Evita subir información confidencial y revisa siempre los resultados generados antes de utilizarlos.',
    ctaLabel: 'Ver planes',
    ctaHref: '#comprar',
  },
  education: {
    eyebrow: 'Aprendizaje',
    title: 'Cursos y bibliotecas para aprender a tu ritmo.',
    lead: 'Agrupamos opciones educativas para idiomas, tecnología, negocios y habilidades creativas. Te indicamos si incluye certificados, progreso personal y acceso desde varios dispositivos.',
    accent: 'yellow',
    examples: ['Coursera', 'Udemy', 'Platzi', 'Duolingo'],
    exampleNote: 'Ejemplos de plataformas; disponibilidad y certificación pueden variar.',
    highlights: ['Progreso personal cuando aplica', 'Vigencia definida', 'Soporte de activación'],
    modes: [
      { label: 'Personal', title: 'Suscripción individual', description: 'Acceso vinculado a tu usuario para guardar progreso, historial y certificados cuando la plataforma los incluya.' },
      { label: 'Biblioteca', title: 'Catálogo por periodo', description: 'Acceso temporal a una biblioteca o colección. Se especifica qué contenidos y funciones están incluidos.' },
      { label: 'Equipo', title: 'Asiento educativo', description: 'Invitación a un plan grupal autorizado para escuelas, equipos o familias, con condiciones claras.' },
    ],
    steps: ['Defines el tema o habilidad que quieres aprender.', 'Revisamos catálogo, idioma y modalidad.', 'Confirmamos vigencia y si incluye certificado.', 'Activamos tu acceso después de validar el pago.'],
    note: 'Un acceso a cursos no garantiza certificados si la plataforma no los incluye. Esa condición aparecerá antes de la compra.',
    ctaLabel: 'Explorar membresías',
    ctaHref: '#comprar',
  },
  vpn: {
    eyebrow: 'Privacidad y conexión',
    title: 'VPN para proteger tu conexión cotidiana.',
    lead: 'Una VPN cifra el tráfico entre tu dispositivo y el servidor del proveedor. Es útil en redes públicas, trabajo remoto y navegación, pero no sustituye antivirus ni buenas prácticas de seguridad.',
    accent: 'mint',
    examples: ['Windows', 'macOS', 'Android', 'iPhone y iPad'],
    exampleNote: 'La compatibilidad exacta depende del plan elegido.',
    highlights: ['Número de dispositivos informado', 'Guía de instalación', 'Renovación y vigencia visibles'],
    modes: [
      { label: 'Propia', title: 'Licencia individual', description: 'Acceso personal con el número de dispositivos permitido por el proveedor. Es la modalidad recomendada.' },
      { label: 'Familiar', title: 'Plan multidispositivo', description: 'Cobertura para varios equipos del mismo usuario o grupo permitido, con cupos y reglas indicados previamente.' },
      { label: 'Asistida', title: 'Instalación acompañada', description: 'Te guiamos para instalar, iniciar sesión y seleccionar una ubicación adecuada en tus dispositivos.' },
    ],
    steps: ['Confirmamos tus dispositivos y objetivo.', 'Te mostramos duración, cupos y compatibilidad.', 'Validamos la transferencia.', 'Entregamos licencia e instrucciones de instalación.'],
    note: 'La VPN no vuelve anónima toda tu actividad ni autoriza a eludir leyes o condiciones de otros servicios. La velocidad puede variar según servidor y conexión.',
    ctaLabel: 'Ver VPN disponible',
    ctaHref: '#comprar',
  },
  'servers-domains': {
    eyebrow: 'Infraestructura',
    title: 'Dominios y servidores con propiedad bien definida.',
    lead: 'Preparamos la base técnica de una web, API, bot o tienda. Antes de contratar se especifica quién es el titular, qué administración incluye y qué recursos tendrá el servidor.',
    accent: 'blue',
    examples: ['Dominio anual', 'Hosting administrado', 'VPS', 'Servidor dedicado'],
    exampleNote: 'Precio final según extensión, recursos y soporte requerido.',
    highlights: ['Titularidad documentada', 'Recursos técnicos visibles', 'Renovación avisada'],
    modes: [
      { label: 'A tu nombre', title: 'Dominio propio', description: 'El dominio se registra con los datos acordados y se documentan renovación, DNS y acceso administrativo.' },
      { label: 'Administrado', title: 'Servidor gestionado', description: 'Nexo se ocupa de una administración básica acordada: despliegue, configuración y seguimiento.' },
      { label: 'Dedicado', title: 'Recursos exclusivos', description: 'VPS o servidor para un proyecto concreto, con CPU, memoria, almacenamiento y alcance de soporte definidos.' },
    ],
    steps: ['Revisamos nombre de dominio o requisitos del proyecto.', 'Entregamos una cotización con recursos y responsabilidades.', 'Validamos pago y datos del titular.', 'Configuramos y entregamos accesos de forma segura.'],
    note: 'Dominio, servidor, respaldos y mantenimiento son conceptos distintos. La cotización indicará qué está incluido para evitar cargos o responsabilidades inesperadas.',
    ctaLabel: 'Ver infraestructura',
    ctaHref: '#comprar',
  },
  'telegram-bots': {
    eyebrow: 'Automatización',
    title: 'Un bot de Telegram diseñado alrededor de tu operación.',
    lead: 'Creamos bots para responder, registrar pedidos, enviar avisos, cobrar o conectar datos. No es una plantilla cerrada: las funciones se cotizan y documentan antes de iniciar.',
    accent: 'coral',
    examples: ['Auto-respuestas', 'Pedidos', 'Notificaciones', 'Panel administrativo'],
    exampleNote: 'También pueden integrarse bases de datos y servicios externos.',
    highlights: ['Alcance cotizado', 'Pruebas antes de entrega', 'Bot bajo control del cliente'],
    modes: [
      { label: 'Inicial', title: 'Bot de funciones básicas', description: 'Comandos, menús, preguntas frecuentes y avisos automáticos para comenzar con rapidez.' },
      { label: 'Integrado', title: 'Bot conectado a tus sistemas', description: 'Incluye base de datos, pagos, API o panel web según la cotización aprobada.' },
      { label: 'Mantenido', title: 'Soporte posterior', description: 'Puede añadirse mantenimiento mensual para cambios, monitoreo y mejoras; se cotiza por separado.' },
    ],
    steps: ['Seleccionas funciones y explicas el flujo.', 'Revisamos requisitos y entregamos alcance.', 'Confirmas la cotización y realizas el pago acordado.', 'Desarrollamos, probamos y entregamos accesos y documentación.'],
    note: 'El token del bot y las credenciales finales deben quedar bajo control del cliente. Funciones nuevas fuera del alcance original se cotizan antes de desarrollarse.',
    ctaLabel: 'Cotizar bot',
    ctaHref: '#solicitudes',
  },
  memberships: {
    eyebrow: 'Nexo Club',
    title: 'Una membresía para agrupar beneficios digitales.',
    lead: 'Básico, Pro y Premium combinan servicios, precios preferentes y nivel de soporte. Los beneficios concretos de cada plan aparecen en su ficha antes del pago.',
    accent: 'ink',
    examples: ['Básico', 'Pro', 'Premium'],
    exampleNote: 'El contenido incluido puede variar cuando se renueva el catálogo.',
    highlights: ['Un solo periodo de vigencia', 'Servicios incluidos visibles', 'Soporte según nivel'],
    modes: [
      { label: 'Básico', title: 'Para comenzar', description: 'Una entrada sencilla al catálogo con los servicios esenciales indicados en el plan.' },
      { label: 'Pro', title: 'Para uso frecuente', description: 'Más servicios y precios preferentes para quien utiliza Nexo cada mes.' },
      { label: 'Premium', title: 'Más cobertura y prioridad', description: 'La combinación más completa disponible, con soporte prioritario y beneficios adicionales.' },
    ],
    steps: ['Comparas precio y servicios incluidos.', 'Eliges el nivel adecuado.', 'Realizas la transferencia con la referencia generada.', 'Activamos la membresía después de validar el comprobante.'],
    note: 'Una membresía Nexo no convierte automáticamente todos los accesos en cuentas individuales. Cada servicio incluido conserva la modalidad indicada en su ficha.',
    ctaLabel: 'Comparar planes',
    ctaHref: '#comprar',
  },
  office: {
    eyebrow: 'Licencias Office',
    title: 'Office según duración, dispositivo y forma de activación.',
    lead: 'Te mostramos si se trata de Microsoft 365 por suscripción o de una edición de compra única. La ficha indicará aplicaciones, vigencia, dispositivos y cuenta asociada.',
    accent: 'yellow',
    examples: ['Microsoft 365 Personal', 'Office Hogar 2024', 'Word', 'Excel y PowerPoint'],
    exampleNote: 'Aplicaciones y compatibilidad dependen de la edición.',
    highlights: ['Tipo de licencia visible', 'Activación acompañada', 'Sin reutilizar claves entre clientes'],
    modes: [
      { label: 'Suscripción', title: 'Microsoft 365', description: 'Licencia con vigencia definida y servicios que pueden incluir almacenamiento o actualizaciones, según la edición.' },
      { label: 'Compra única', title: 'Office Hogar', description: 'Edición para un dispositivo compatible, sin renovación mensual; no necesariamente incluye futuras versiones.' },
      { label: 'Asistida', title: 'Activación guiada', description: 'Te acompañamos para asociar o activar la licencia y comprobar que las aplicaciones queden funcionando.' },
    ],
    steps: ['Confirmamos sistema operativo y dispositivo.', 'Revisas edición, aplicaciones y vigencia.', 'Realizas la transferencia.', 'Entregamos y acompañamos la activación.'],
    note: 'La ficha final prevalece sobre cualquier descripción general. No compres antes de confirmar compatibilidad, número de dispositivos y si la licencia es suscripción o compra única.',
    ctaLabel: 'Ver licencias',
    ctaHref: '#comprar',
  },
  'online-orders': {
    eyebrow: 'Compra asistida',
    title: 'Compramos en línea por ti, con el cálculo visible.',
    lead: 'Nos compartes el enlace y el monto del producto. El sistema calcula el valor más la comisión de servicio del 15%; procesamos la compra después de validar la transferencia.',
    accent: 'mint',
    examples: ['Producto físico', 'Producto digital', 'Tienda nacional', 'Tienda internacional'],
    exampleNote: 'La viabilidad depende de la tienda, entrega y restricciones del producto.',
    highlights: ['Comisión calculada antes de pagar', 'Comprobante validado', 'Seguimiento del pedido'],
    modes: [
      { label: 'Nacional', title: 'Pedido dentro de México', description: 'Revisamos precio, envío y datos necesarios para completar la compra en una tienda compatible.' },
      { label: 'Internacional', title: 'Compra en otra región', description: 'Primero se cotizan conversión, envío, impuestos y posibles restricciones. El 15% no sustituye esos cargos.' },
      { label: 'Digital', title: 'Entrega electrónica', description: 'Cuando el producto lo permite, se acuerda el correo o medio de entrega antes de procesar la orden.' },
    ],
    steps: ['Pegas el enlace y escribes el monto.', 'Calculamos producto, comisión y cargos conocidos.', 'Transfieres y envías el comprobante.', 'Validamos, compramos y actualizamos el seguimiento.'],
    note: 'No procesamos productos restringidos o ilegales. Cambios de precio, inventario, impuestos o envío se confirman antes de realizar la compra.',
    ctaLabel: 'Solicitar pedido',
    ctaHref: '#solicitudes',
  },
};

export function guideForService(id: string, category: string): ServiceGuideKey {
  const byId: Record<string, ServiceGuideKey> = {
    'streaming-packs': 'streaming',
    'ai-workspace': 'ai',
    'learning-club': 'education',
    'vpn-shield': 'vpn',
    'servers-domains': 'servers-domains',
    'telegram-bots': 'telegram-bots',
  };

  const byCategory: Record<string, ServiceGuideKey> = {
    streaming: 'streaming',
    ai: 'ai',
    education: 'education',
    infrastructure: 'servers-domains',
    automation: 'telegram-bots',
    commerce: 'online-orders',
  };

  return byId[id] ?? byCategory[category] ?? 'memberships';
}

export function guideForProduct(type: string): ServiceGuideKey {
  if (type === 'LICENCIA_OFFICE') return 'office';
  if (type === 'VPN') return 'vpn';
  if (type === 'SERVIDOR' || type === 'DOMINIO') return 'servers-domains';
  return 'office';
}
