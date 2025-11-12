export const fetchWaterBoundariesInfoAPI = async (pwsid, { signal } = {}) => {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/water-system/${pwsid}`, {
            signal,
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });
    
        if (!res.ok) {
            throw new Error(await res.text());
        }
    
        const data = await res.json();
        return { data };
    } catch (error) {
        return { error: error.message || 'An error occurred' };
    }
};  