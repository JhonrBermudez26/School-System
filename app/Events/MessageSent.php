<?php

namespace App\Events;

use App\Models\Message;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;

    public function __construct(Message $message)
    {
        $this->message = $message;
    }

    public function broadcastOn()
    {
        $channels = [
            new Channel('conversation.' . $this->message->conversation_id),
        ];

        // Canal privado por usuario para notificaciones globales
        $participants = $this->message->conversation->participants()->with('user')->get();

        foreach ($participants as $participant) {
            if ($participant->user_id !== $this->message->user_id) {
                $channels[] = new PrivateChannel('App.Models.User.' . $participant->user_id);
            }
        }

        return $channels;
    }

    public function broadcastAs()
    {
        return 'message.sent';
    }

    public function broadcastWith()
    {
        return [
            'message' => $this->message->load([
                'user:id,name,last_name,photo',
                'conversation:id'
            ]),
        ];
    }
}