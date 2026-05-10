import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate user credentials and return a JWT token.
   * @param loginDto Validated login data
   * @returns JWT access token
   */
  async login(loginDto: LoginDto) {
    const { matricule, password } = loginDto;

    const user = await this.usersService.findByMatricule(matricule);

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      matricule: user.matricule,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
