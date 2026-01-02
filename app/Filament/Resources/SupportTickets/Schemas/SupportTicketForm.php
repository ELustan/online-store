<?php

namespace App\Filament\Resources\SupportTickets\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class SupportTicketForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Ticket Details')
                    ->schema([
                        TextInput::make('subject')
                            ->disabled()
                            ->dehydrated(false),
                        Textarea::make('message')
                            ->disabled()
                            ->dehydrated(false)
                            ->columnSpanFull(),
                        Select::make('priority')
                            ->options([
                                'low' => 'Low',
                                'normal' => 'Normal',
                                'high' => 'High',
                                'urgent' => 'Urgent',
                            ])
                            ->required(),
                        Select::make('status')
                            ->options([
                                'open' => 'Open',
                                'in_progress' => 'In progress',
                                'resolved' => 'Resolved',
                                'closed' => 'Closed',
                            ])
                            ->required(),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),
            ]);
    }
}
