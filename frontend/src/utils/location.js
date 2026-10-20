export const getCurrentLocation = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported');
        error.code = 'UNSUPPORTED';
        reject(error);
        return;
    }

    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
        try {
            const url = new URL('https://api.bigdatacloud.net/data/reverse-geocode-client');
            url.searchParams.set('latitude', coords.latitude);
            url.searchParams.set('longitude', coords.longitude);
            url.searchParams.set('localityLanguage', 'uk');

            const response = await fetch(url);
            if (!response.ok) throw new Error('Reverse geocoding failed');
            const place = await response.json();
            const country = place.countryName?.trim();
            const city = place.city?.trim();
            if (!country || !city) throw new Error('Country or city was not returned');

            resolve({ country, city });
        } catch {
            const error = new Error('Could not determine city and country');
            error.code = 'REVERSE_GEOCODING_FAILED';
            reject(error);
        }
    }, reject, { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 });
});