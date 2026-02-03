<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class NewPublicacion implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $publicacion;
    public $subject_id;
    public $group_id;

    public function __construct($publicacion, $subject_id, $group_id)
    {
        $this->publicacion = $publicacion;
        $this->subject_id = $subject_id;
        $this->group_id = $group_id;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("clase.{$this->subject_id}.{$this->group_id}"),
        ];
    }

    public function broadcastAs()
    {
        return 'nueva.publicacion';
    }

    public function broadcastWith()
{
    return [
        'publicacion' => $this->publicacion,
    ];
}
}