-- Remove "Boxel" from lost_reasons (not a valid competitor)
DELETE FROM lost_reasons
WHERE reason_en = 'Boxel' AND category = 'competitors';
