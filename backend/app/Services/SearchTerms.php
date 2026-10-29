<?php

namespace App\Services;

/**
 * Maps the words residents actually type (Bisaya, Filipino, old agency names, common misspellings)
 * to the official terms used in guide titles, so "sedula" finds the cedula guide and "NSO" finds PSA.
 */
class SearchTerms
{
    /** Local word or phrase => official term to search for as well. Keys are lowercase. */
    private const TERMS = [
        // Documents and clearances
        'sedula' => 'cedula',
        'cedula' => 'community tax certificate',
        'ctc' => 'community tax certificate',
        'pulis' => 'police',
        'pulisya' => 'police',
        'lisensya' => 'license',
        'lisensiya' => 'license',
        'pasaporte' => 'passport',
        'birthcert' => 'birth certificate',
        'birth cert' => 'birth certificate',
        'pagkatawo' => 'birth',
        'kapanganakan' => 'birth',
        'kasal' => 'marriage',
        'kaminyoon' => 'marriage',
        'national id' => 'philsys',
        'philid' => 'philsys',
        'nso' => 'psa',
        // Agencies and programs
        'pagibig' => 'pag-ibig',
        'pag ibig' => 'pag-ibig',
        'hdmf' => 'pag-ibig',
        'phil health' => 'philhealth',
        'ss number' => 'sss',
        'brgy' => 'barangay',
        'munisipyo' => 'city hall',
        'cityhall' => 'city hall',
        // Everyday words
        'negosyo' => 'business',
        "mayor's permit" => 'business permit',
        'mayors permit' => 'business permit',
        'buhis' => 'tax',
        'buwis' => 'tax',
        'utang' => 'loan',
        'pautang' => 'loan',
        'trabaho' => 'jobseeker',
        'first time job' => 'jobseeker',
        'senior' => 'senior citizen',
        'tigulang' => 'senior citizen',
    ];

    /** @return list<string> the query first, then each distinct official term it maps to. */
    public static function expand(string $query): array
    {
        $normalized = ' ' . preg_replace('/\s+/', ' ', mb_strtolower($query)) . ' ';
        $terms = [$query];
        foreach (self::TERMS as $local => $official) {
            // Whole words only, so "senior" doesn't match inside another word.
            if (preg_match('/(?<![\p{L}\p{N}])' . preg_quote($local, '/') . '(?![\p{L}\p{N}])/u', $normalized)) {
                $terms[] = $official;
            }
        }
        return array_values(array_unique($terms));
    }
}
