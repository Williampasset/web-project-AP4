import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ArticlesModule } from './articles/articles.module';
import { CommandsModule } from './commands/commands.module';
import { SuppliersModule } from './suppliers/suppliers.module';
import { TrucksModule } from './trucks/trucks.module';
import { ClientsModule } from './clients/clients.module';
import { CommandPreparationModule } from './command-preparation/command-preparation.module';
import { LocationsModule } from './locations/locations.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    ArticlesModule,
    SuppliersModule,
    CommandsModule,
    TrucksModule,
    ClientsModule,
    CommandPreparationModule,
    LocationsModule,
  ],
})
export class AppModule {}
