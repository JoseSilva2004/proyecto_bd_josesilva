import { IsDefined, IsBoolean, IsUUID } from "class-validator";

export class CardUser {
    
    @IsBoolean()
    @IsDefined()
    isOwner: boolean;
    
    @IsUUID()
    @IsDefined()
    user_Id: string;

    @IsUUID()
    @IsDefined()
    card_Id: string;
    
}