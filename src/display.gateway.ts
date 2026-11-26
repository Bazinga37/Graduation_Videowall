import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DisplayService } from './display.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class DisplayGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  constructor(private display: DisplayService) {
    display.onChange((slide) => this.server?.emit(slide ? 'show' : 'idle', slide));
  }

  // zid koji se (ponovno) spoji odmah dobije trenutno stanje
  handleConnection(client: Socket) {
    const cur = this.display.getCurrent();
    client.emit(cur ? 'show' : 'idle', cur);
  }
}
