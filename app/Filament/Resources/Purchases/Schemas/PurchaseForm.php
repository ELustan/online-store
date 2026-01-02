<?php

namespace App\Filament\Resources\Purchases\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class PurchaseForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Order Details')
                    ->schema([
                        TextInput::make('payment_reference')
                            ->disabled()
                            ->dehydrated(false),
                        Select::make('status')
                            ->options([
                                'pending' => 'Pending',
                                'completed' => 'Completed',
                                'paid' => 'Paid',
                                'failed' => 'Failed',
                            ])
                            ->required(),
                        TextInput::make('amount_due')
                            ->disabled()
                            ->dehydrated(false)
                            ->prefix('$'),
                        TextInput::make('cashback_total')
                            ->disabled()
                            ->dehydrated(false)
                            ->prefix('$'),
                        DateTimePicker::make('purchased_at')
                            ->disabled()
                            ->dehydrated(false),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),
            ]);
    }
}
