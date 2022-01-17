const errorMessage = (role: string) => `Usuario no es un ${role}.`;

export const userIsNotClientError = () => errorMessage("cliente");
export const userIsNotInstructorError = () => errorMessage("instructor");
export const userIsNotAdminError = () => errorMessage("administrador");
