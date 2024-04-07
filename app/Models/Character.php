<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Character extends Model
{
    use HasFactory;

    protected $table = 'characters';

    // Mass assignable attributes
    protected $fillable = [
        'japanese_name', 'romanized_name', 'official_english_name', 'debut', 'affiliations',
        'occupations', 'status', 'birthday', 'japanese_va', 'funi_english_va', 'residence',
        'epithet', 'age', 'height', 'blood_type', 'bounty', 'odex_english_va', 'four_kids_english_va',
        'origin', 'alias', 'real_name', 'english_name', 'type', 'meaning', 'size', 'weight',
        'first_appearance', 'age_at_death', 'zombie_number', 'region', 'gladiator_number', 'features',
        'literal_meaning', 'captain', 'total_bounty', 'cp9_key', 'affiliation', 'completion_date', 'affiliates',
    ];
}
