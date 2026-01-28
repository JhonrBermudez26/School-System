<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatNotification implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $userId;
    public $conversationId;
    public $senderName;
    public $message;

    public function __construct($userId, $conversationId, $senderName, $message)
    {
        $this->userId = $userId;
        $this->conversationId = $conversationId;
        $this->senderName = $senderName;
        $this->message = $message;
    }

    public function broadcastOn()
    {
        return new PrivateChannel('user.' . $this->userId);
    }

    public function broadcastAs()
    {
        return 'chat.notification';
    }

    public function broadcastWith()
    {
        return [
            'conversation_id' => $this->conversationId,
            'sender_name' => $this->senderName,
            'message' => $this->message,
        ];
    }
}