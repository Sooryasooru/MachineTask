export type ShareRole = "EDITOR" | "VIEWER";

export type AccessLevel = "OWNER" | "EDITOR" | "VIEWER";

export type ShareView = {
  userId: string;
  name: string;
  email: string;
  role: ShareRole;
};

export type ApiErrorBody = {
  error: string;
};
