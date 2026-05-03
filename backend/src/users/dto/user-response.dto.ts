import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enum/role.enum';

export class UserResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  matricule!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty({ enum: Role })
  role!: Role;

  @ApiProperty({ required: false })
  managerId!: number | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}
