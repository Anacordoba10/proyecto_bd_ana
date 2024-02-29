import { IsDate, IsDateString, IsDefined, Length } from "class-validator";

export class Card {
  @IsDefined()
  @Length(5, 30)
  title: string;

  @IsDefined()
  @Length(5, 200)
  description: string;

  @IsDefined()
  @IsDateString()
  due_date: Date;
  }