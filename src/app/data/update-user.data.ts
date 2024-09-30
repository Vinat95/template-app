export interface UserMetadata {
  nickname: string;
}

export interface UserAuth {
  email: string;
  picture?: string;
  user_metadata: UserMetadata;
}
