import { IsDefined, IsUUID, IsBooleanString } from "class-validator";

export class CardUser {
    
    @IsBooleanString()
    @IsDefined()
    isOwner: boolean;
    
    @IsUUID()
    @IsDefined()
    user_Id: string;

    @IsUUID()
    @IsDefined()
    card_Id: string;
    
}