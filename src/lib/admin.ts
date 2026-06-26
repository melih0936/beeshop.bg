export const adminEmails = ["melih0936@abv.bg", "efsennchane@gmail.com"];

export function isAdminEmail(email?: string | null) {
  return Boolean(
    email &&
      adminEmails.includes(email.trim().toLocaleLowerCase("bg-BG")),
  );
}
