import { IsNotEmpty, IsDefined, Length, IsUUID, IsDateString } from "class-validator";

export class Card {
    @Length(5, 30)
    @IsDefined()
    title: string;

    @IsDefined()
    @Length(0, 256)
    description: string;

    @IsDefined()
    @IsDateString()
    due_date: string;

    @IsUUID()
    @IsNotEmpty()
    list_id: string;
}