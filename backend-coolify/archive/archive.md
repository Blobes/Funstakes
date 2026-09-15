/\*\*

- Resolves IP address into standard GeoJSON Point location structure.
- @param ipAddress Target client IP address.
- @returns Formatted GeoJSON point location object or undefined.
  \*/
  export const buildLocationFromIp = async (
  ipAddress: string,
  ): Promise<ILocation | undefined> => {
  const geoData = await getLocationFromIp(ipAddress);
  if (!geoData) return undefined;

return {
name: `${geoData.city}, ${geoData.state}, ${geoData.country}`,
city: geoData.city,
state: geoData.state,
country: geoData.country,
region: geoData.regionCode,
continent: geoData.continent,
type: "Point" as const,
coordinates: [Number(geoData.longitude), Number(geoData.latitude)],
};
};
