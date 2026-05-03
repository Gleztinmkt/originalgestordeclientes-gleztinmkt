import { useEffect } from "react";
import { Link } from "react-router-dom";

const Privacy = () => {
  useEffect(() => {
    document.title = "Política de privacidad | GestorAgencia";
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-10">
        <header className="space-y-4 border-b border-border pb-8">
          <p className="text-sm text-muted-foreground">GestorAgencia</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Política de privacidad</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            En GestorAgencia tratamos la información de nuestros clientes y sus cuentas conectadas de forma profesional,
            responsable y con medidas razonables de seguridad para la gestión de contenido en redes sociales.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Qué hace la aplicación</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            GestorAgencia es una herramienta utilizada para conectar cuentas de Instagram y Facebook de clientes,
            publicar o programar contenido, centralizar operaciones de marketing y administrar información necesaria para
            la ejecución profesional de campañas y publicaciones.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Qué datos podemos almacenar</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Según la integración habilitada, podemos almacenar datos como nombre de página, nombre comercial, usuario de
            Instagram, identificadores de cuenta, identificadores de páginas conectadas, permisos otorgados y tokens de
            acceso necesarios para mantener activa la conexión con Meta y operar las funciones solicitadas por el cliente.
          </p>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            También podemos guardar información operativa relacionada con la programación de publicaciones, historial de
            conexión, configuraciones internas, registros técnicos y datos mínimos necesarios para diagnosticar errores o
            garantizar la continuidad del servicio.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Cómo usamos la información</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-muted-foreground sm:text-base">
            <li>Conectar cuentas de Facebook e Instagram autorizadas por el usuario o cliente.</li>
            <li>Publicar, programar, revisar o administrar contenido en nombre del cliente.</li>
            <li>Sincronizar datos técnicos necesarios para el funcionamiento de la integración con Meta.</li>
            <li>Proteger la cuenta, prevenir errores operativos y mantener trazabilidad interna del servicio.</li>
            <li>Brindar soporte, seguimiento y gestión profesional de las cuentas vinculadas.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Seguridad y tratamiento profesional</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Implementamos medidas técnicas y organizativas razonables para proteger la información almacenada, limitar el
            acceso a personal autorizado y reducir riesgos de pérdida, uso indebido o acceso no autorizado. Los tokens y
            datos vinculados a integraciones se conservan únicamente para fines operativos legítimos y de acuerdo con el
            alcance del servicio contratado.
          </p>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Operamos el sistema con criterios profesionales y procuramos cumplir de forma responsable con buenas prácticas
            de privacidad, seguridad y gestión de información aplicables al tipo de servicio prestado.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Compartición de datos</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            No vendemos la información de nuestros clientes. Los datos solo pueden ser tratados por plataformas,
            proveedores o herramientas necesarias para operar la integración, alojar el sistema, brindar soporte técnico
            o ejecutar funciones estrictamente relacionadas con el servicio solicitado.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Conservación y derechos</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Conservamos los datos durante el tiempo necesario para mantener la integración activa, prestar el servicio,
            cumplir obligaciones operativas o resolver incidencias. El usuario o cliente puede solicitar revisión,
            actualización o eliminación de datos relacionados con la integración según corresponda.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">7. Contacto</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Para consultas sobre privacidad o tratamiento de datos, podés escribir a{