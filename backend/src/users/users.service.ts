import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new user in database
   * @param createUserDto Validated data for user creation
   * @returns User create
   */
  async create(createUserDto: CreateUserDto) {
    const { matricule, password } = createUserDto;
    if (await this.isMatriculeAlreadyUsed(matricule)) {
      throw new ConflictException(
        'The user matricule is already used by another user',
      );
    }

    const hashedPassword = await this.hashPassword(password);

    const result = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    return result;
  }

  /**
   * Retrieve all users in database
   * @returns All users in database
   */
  async findAll() {
    const result = await this.prisma.user.findMany();
    return result;
  }

  /**
   * Find a user by id.
   * @param id User's id we want to get
   * @returns User data matching the id
   */
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    return user;
  }

  /**
   * Find a user by matricule.
   * @param matricule The matricule to search for.
   * @returns The user matching the matricule.
   */
  async findByMatricule(matricule: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        matricule: matricule,
      },
    });

    if (!user) throw new NotFoundException(`User #${matricule} not found`);

    return user;
  }

  /**
   * Update an existing user by id.
   * @param id Identifier of the user to update.
   * @param updateUserDto Validated data for updating the user.
   * @returns The updated user.
   */
  async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    return this.prisma.user.update({
      where: { id: id },
      data: { ...updateUserDto },
    });
  }

  /**
   * Delete a user by id.
   * @param id Identifier of the user to remove.
   * @returns The deleted user.
   */
  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    return this.prisma.user.delete({ where: { id } });
  }

  /**
   * Check whether a matricule is already used by an existing user.
   * @param matricule The matricule to check.
   * @returns True if the matricule is already taken, otherwise false.
   */
  async isMatriculeAlreadyUsed(matricule: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { matricule } });
    return !!user;
  }

  /**
   * Hash a plain text password using bcrypt.
   * @param password The plain text password to hash.
   * @returns The hashed password string.
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }
}
