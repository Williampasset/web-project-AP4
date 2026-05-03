import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { CommandsModule } from './commands/commands.module';
import { SuppliersModule } from './suppliers/suppliers.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ArticlesModule,
    SuppliersModule,
    CommandsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
