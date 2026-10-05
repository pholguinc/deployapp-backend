import { Injectable, NotFoundException } from '@nestjs/common';
import { SettingsRepository } from '../repositories/settings.repository';
import { UpsertSettingDto } from '../dtos/upsert-setting.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly settingsRepository: SettingsRepository) {}

  async getByKey(key: string) {
    const setting = await this.settingsRepository.findByKey(key);
    if (!setting) {
      throw new NotFoundException(
        `Configuración con clave "${key}" no encontrada`,
      );
    }
    return setting;
  }

  async getByKeyOrDefault<T>(key: string, defaultValue: T): Promise<T> {
    const setting = await this.settingsRepository.findByKey(key);
    if (!setting) {
      return defaultValue;
    }
    return setting.value as T;
  }

  async getAll() {
    return this.settingsRepository.findAll();
  }

  async upsert(key: string, dto: UpsertSettingDto) {
    return this.settingsRepository.upsert(key, dto.value, dto.description);
  }
}
