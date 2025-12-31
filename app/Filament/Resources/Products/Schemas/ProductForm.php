<?php

namespace App\Filament\Resources\Products\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Schema;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('category_id')
                    ->relationship('category', 'name')
                    ->required(),
                FileUpload::make('image')
                    ->disk('public')
                    ->directory('product-images')
                    ->visibility('public')
                    ->image(),
                TextInput::make('name')
                    ->required(),
                TextInput::make('slug')
                    ->required(),
                Textarea::make('description')
                    ->columnSpanFull(),
                TextInput::make('price')
                    ->required()
                    ->numeric()
                    ->default(0.0)
                    ->prefix('$'),
                TextInput::make('discount_percent')
                    ->required()
                    ->numeric()
                    ->default(0.0),
                TextInput::make('cashback_percent')
                    ->required()
                    ->numeric()
                    ->default(0.0),
                TextInput::make('promo_label'),
                DateTimePicker::make('promo_expires_at'),
            ]);
    }
}
