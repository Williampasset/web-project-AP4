import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { CommandsModule } from './commands/commands.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TrucksModule } from './trucks/trucks.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ArticlesModule,
    SuppliersModule,
    CommandsModule,
    TrucksModule,
  ],
})
export class AppModule {}
