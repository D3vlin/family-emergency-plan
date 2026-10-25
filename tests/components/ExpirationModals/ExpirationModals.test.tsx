import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExpirationModals from "@components/ExpirationModals/ExpirationModals";

describe("ExpirationModals", () => {
  it("shows the 13-minute warning with a 'Seguir trabajando' button", () => {
    const onContinueWorking = vi.fn();
    render(
      <ExpirationModals
        warningVisible
        onContinueWorking={onContinueWorking}
        expiredRedirectVisible={false}
        onGoToStart={() => {}}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /seguir trabajando/i }));
    expect(onContinueWorking).toHaveBeenCalledTimes(1);
  });

  it("shows the 15-minute redirect notice with an 'Ir al inicio' button", () => {
    const onGoToStart = vi.fn();
    render(
      <ExpirationModals
        warningVisible={false}
        onContinueWorking={() => {}}
        expiredRedirectVisible
        onGoToStart={onGoToStart}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /ir al inicio/i }));
    expect(onGoToStart).toHaveBeenCalledTimes(1);
  });

  it("renders neither modal when nothing has expired", () => {
    render(
      <ExpirationModals
        warningVisible={false}
        onContinueWorking={() => {}}
        expiredRedirectVisible={false}
        onGoToStart={() => {}}
      />,
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
