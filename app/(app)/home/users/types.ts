export type User = {
  id: number;
  username: string;
  rol_user: {
    nombre: string;
  };
  persona: {
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    rol_persona: {
      nombre: string;
    };
  };
};