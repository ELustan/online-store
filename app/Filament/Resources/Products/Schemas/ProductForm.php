<?php

namespace App\Filament\Resources\Products\Schemas;

use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ProductForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Product Information')
                    ->schema([
                        TextInput::make('name')
                            ->required(),
                        Select::make('category_id')
                            ->searchable()
                            ->relationship('category', 'name')
                            ->required(),
                        RichEditor::make('description')
                            ->columnSpanFull(),
                        FileUpload::make('image')
                            ->disk('public')
                            ->directory('product-images')
                            ->visibility('public')
                            ->image()
                    ])
                    ->columns(2)
                    ->columnSpanFull(),
                Section::make('Price Details')
                    ->schema([
                        TextInput::make('price')
                            ->required()
                            ->numeric()
                            ->rules(['min:1'])
                            ->default(0.0)
                            ->prefix('$'),
                        TextInput::make('discount_percent')
                            ->required()
                            ->suffix('%') 
                            ->minValue(0)
                            ->maxValue(100)
                            ->numeric()
                            ->inputMode('decimal')
                            ->default(0.0),
                        TextInput::make('cashback_percent')
                            ->required()
                            ->suffix('%') 
                            ->minValue(0)
                            ->maxValue(100)
                            ->numeric()
                            ->inputMode('decimal')
                            ->default(0.0),
                        TextInput::make('promo_label')
                            ->placeholder('e.g. Limited Time Offer')
                            ->columnSpan(2),
                        DateTimePicker::make('promo_expires_at')
                            ->helperText("This shows when the promo will expire")
                    ])
                    ->columns(3)
                    ->columnSpanFull(),
                Repeater::make('images')
                    ->relationship('images')
                    ->schema([
                        FileUpload::make('path')
                            ->disk('public')
                            ->directory('product-images'),
                        Textarea::make('caption')
                    ])
            ]);
    }
}
