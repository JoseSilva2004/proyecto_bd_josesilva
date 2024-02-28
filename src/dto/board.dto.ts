import { IsDefined, IsString, IsUUID, Length, IsBoolean} from "class-validator";

export class Board {
  
  @IsString()
  @IsDefined()
  @Length(5, 30)
  name: string;

  isAdmin: boolean;

  boardId: string;

  @IsDefined()
  @IsUUID()
  adminUserId: string;
}
