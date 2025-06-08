export type Identity = {
  id: string;
  credential?: AuthCredential;
};

export type AuthCredential = {
  type: "cookie";
};
