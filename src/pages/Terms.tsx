import { useEffect } from "react";
import { Link } from "react-router-dom";

const Terms = () => {
  useEffect(() => {
    document.title = "Condiciones del servicio | GestorAgencia";
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-10">
        <header className="space-y-4 border-b border-border pb-8">
          <p className="text-sm text-muted-foreground">GestorAgencia</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Condiciones del servicio</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Estas condiciones describen las reglas básicas de uso de GestorAgencia para la gestión profesional de cuentas,
            publicaciones, programación de contenido e integraciones con plataformas de terceros.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">1. Uso permitido</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            El sistema debe utilizarse únicamente para fines comerciales y operativos legítimos, con autorización del
            titular de cada cuenta conectada. El usuario se compromete a no usar la plataforma para actividades ilícitas,
            engañosas, abusivas o contrarias a las políticas de Meta u otros proveedores integrados.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">2. Responsabilidad sobre accesos y contenido</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Cada usuario es responsable por la veracidad de los datos proporcionados, por los permisos con los que conecta
            cuentas de terceros y por el contenido que decide publicar, programar o administrar mediante la plataforma.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">3. Disponibilidad del servicio</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Procuramos mantener el sistema operativo, seguro y actualizado de forma profesional. Sin embargo, la
            disponibilidad puede verse afectada por tareas de mantenimiento, cambios en APIs externas, fallas técnicas o
            eventos fuera de nuestro control razonable.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">4. Integraciones de terceros</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Algunas funciones dependen de servicios externos como Meta, Instagram y Facebook. El uso de esas integraciones
            también puede estar sujeto a los términos, políticas y limitaciones impuestas por dichos terceros.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">5. Suspensión o finalización</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Nos reservamos la posibilidad de suspender accesos, desconectar integraciones o limitar funciones cuando sea
            necesario para proteger la seguridad del sistema, cumplir obligaciones legales o prevenir usos indebidos.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">6. Actualizaciones</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Estas condiciones pueden actualizarse para reflejar mejoras del servicio, cambios regulatorios o ajustes en la
            operación de la plataforma. La versión publicada en esta página será la referencia vigente.
          </p>
        </section>

        <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <Link className="underline underline-offset-4" to="/privacy">
              Política de privacidad
            </Link>
            <Link className="underline underline-offset-4" to="/data-deletion">
              Eliminación de datos
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default Terms;
