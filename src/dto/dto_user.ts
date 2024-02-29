import { IsAlpha, IsDefined, IsEmail, Length } from "class-validator";

export class User {
  @IsAlpha()
  @IsDefined()
  @Length(5, 30)
  name: string;

  @IsEmail()
  @IsDefined()
  email: string;
}
