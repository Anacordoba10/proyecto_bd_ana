import { IsDefined, Length } from "class-validator";

export class List {
    @IsDefined()
    @Length(5, 30)
    name: string;
  }