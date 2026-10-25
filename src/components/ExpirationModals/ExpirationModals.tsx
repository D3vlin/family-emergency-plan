import Modal from "@components/Modal/Modal";

interface ExpirationModalsProps {
  warningVisible: boolean;
  onContinueWorking: () => void;
  expiredRedirectVisible: boolean;
  onGoToStart: () => void;
}

export default function ExpirationModals({
  warningVisible,
  onContinueWorking,
  expiredRedirectVisible,
  onGoToStart,
}: ExpirationModalsProps) {
  if (!warningVisible && !expiredRedirectVisible) return null;

  return (
    <>
      {warningVisible && (
        <Modal role="alertdialog" ariaLabel="Aviso de inactividad">
          <div className="text-center">
            <p className="text-sm text-slate-700 dark:text-slate-300">Tu progreso se borrará pronto por inactividad.</p>
            <button type="button" className="btn-primary w-full mt-3" autoFocus onClick={onContinueWorking}>
              Seguir trabajando
            </button>
          </div>
        </Modal>
      )}
      {expiredRedirectVisible && (
        <Modal role="alertdialog" ariaLabel="Progreso expirado">
          <div className="text-center">
            <p className="text-sm text-slate-700 dark:text-slate-300">Tu progreso expiró y se borró. Vas a volver al inicio.</p>
            <button type="button" className="btn-primary w-full mt-3" autoFocus onClick={onGoToStart}>
              Ir al inicio
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
