import Image from "next/image";

// Los tres únicos usos de marca de la app. Las dimensiones son las
// intrínsecas de los PNG de public/marca/ (next/image las exige); el tamaño
// real lo pone el CSS de la clase que reciben.
const LOCKUP = { w: 820, h: 174 };
const ISOTIPO = { w: 212, h: 217 };

/** Logotipo completo en blanco. Solo sobre campo azul. */
export function LockupBlanco({
  className,
  priority,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/marca/lockup-blanco.png"
      alt="Colsubsidio"
      width={LOCKUP.w}
      height={LOCKUP.h}
      className={className}
      priority={priority}
    />
  );
}

/** Símbolo suelto. `alt=""` porque siempre acompaña a un lockup o a un nombre. */
export function IsotipoBlanco({ className }: { className?: string }) {
  return (
    <Image
      src="/marca/isotipo-blanco.png"
      alt=""
      width={ISOTIPO.w}
      height={ISOTIPO.h}
      className={className}
    />
  );
}

export function IsotipoAzul({ className }: { className?: string }) {
  return (
    <Image
      src="/marca/isotipo-azul.png"
      alt=""
      width={ISOTIPO.w}
      height={ISOTIPO.h}
      className={className}
    />
  );
}
