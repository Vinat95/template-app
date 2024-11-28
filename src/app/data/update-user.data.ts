export interface UserMetadata {
  nickname: string;
}

export interface UserAuth {
  email: string;
  picture?: string;
  user_metadata: UserMetadata;
}

export interface UserRegister {
  email: string;
  picture?: string;
  password: string;
  user_metadata: UserMetadata;
}

export interface UserLogin {
  username: string;
  password: string;
}
