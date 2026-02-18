<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $messageId;
    public int $conversationId;
    public string $deleteFor; // 'everyone' | 'me'

    public function __construct(int $messageId, int $conversationId, string $deleteFor)
    {
        $this->messageId      = $messageId;
        $this->conversationId = $conversationId;
        $this->deleteFor      = $deleteFor;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('conversation.' . $this->conversationId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'message.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'message_id'  => $this->messageId,
            'delete_for'  => $this->deleteFor,
        ];
    }
}