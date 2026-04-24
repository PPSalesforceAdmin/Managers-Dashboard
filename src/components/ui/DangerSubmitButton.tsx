"use client";

interface Props {
  formAction: (formData: FormData) => void | Promise<void>;
  confirmMessage: string;
  children: React.ReactNode;
  className?: string;
}

// Submit button that overrides its parent form's action via formAction,
// and prompts the user to confirm before the submit proceeds. Useful for
// destructive actions inside a form whose primary action is Save.
export function DangerSubmitButton({
  formAction,
  confirmMessage,
  children,
  className,
}: Props) {
  return (
    <button
      type="submit"
      formAction={formAction}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      className={
        className ??
        "rounded-pp-button border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
      }
    >
      {children}
    </button>
  );
}
