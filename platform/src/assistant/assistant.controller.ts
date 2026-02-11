import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AssistantService } from './assistant.service';

@Controller('assistant')
export class AssistantController {
    constructor(private readonly assistantService: AssistantService) { }

    @Post('chat')
    async chat(@Body('message') message: string) {
        return await this.assistantService.processMessage(message);
    }

    // Opcional: GET para testes simples via navegador
    @Get('test')
    async test(@Query('msg') msg: string) {
        return await this.assistantService.processMessage(msg || 'relatorio');
    }
}
