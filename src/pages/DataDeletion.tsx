import { useEffect } from "react";
import { Link } from "react-router-dom";

const DataDeletion = () => {
  useEffect(() => {
    document.title = "Eliminación de datos | GestorAgencia";
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12 sm:px-8 lg:px-10">
        <header className="space-y-4 border-b border-border pb-8">
          <p className="text-sm text-muted-foreground">GestorAgencia</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">Solicitud de eliminación de datos</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
            Si querés solicitar la eliminación de tus datos vinculados a la integración con Meta, podés hacerlo por medio
            del canal de contacto indicado en esta página.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Cómo solicitar la eliminación</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Enviá un correo a <a className="font-medium text-primary underline underline-offset-4" href="mailto:privacidad@gestoragencia.app">privacidad@gestoragencia.app</a> indicando
            tu nombre, la cuenta o página vinculada y el detalle de la solicitud. Para proteger la información, podremos
            pedir datos mínimos de validación antes de procesar la eliminación.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Qué se elimina</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Al recibir y validar una solicitud de eliminación, se procederá a remover la conexión con Meta, los tokens de
            acceso asociados, identificadores de cuenta vinculados a la integración y demás datos relacionados con esa
            conexión dentro del alcance operativo del sistema.
          </p>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            En caso de existir información que debamos conservar temporalmente por motivos técnicos, legales,
            administrativos o de seguridad, dicha conservación se limitará al mínimo necesario y por el tiempo
            estrictamente correspondiente.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-semibold">Plazo de gestión</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            Las solicitudes se revisan y gestionan dentro de un plazo razonable, conforme a la complejidad del caso y a
            las validaciones requeridas para asegurar que la eliminación sea correcta y segura.
          </p>
        </section>

        <footer className="border-t border-border pt-6 text-sm text-muted-foreground">
          <div className="flex flex-wrap gap-4">
            <Link className="underline underline-offset-4" to="/privacy">
              Política de privacidad
            </Link>
            <Link className="underline underline-offset-4" to="/terms">
              Condiciones del servicio
            </Link>
          </div>
        </footer>
      </section>
    </main>
  );
};

export default DataDeletion;
