import api from "./api";
import { IF_ERROR_PERSISTS } from "@/utils/constants";

// Get all label styles
export const getLabelStylesAPI = async () => {
    try {
        const response = await api.get("/api/layer-styles/label-styles");
        
        return {
            data: response.data,
        };
    } catch (error) {
        console.error('Get label styles API error:', error.response?.data || error);
        return {
            error: error.response?.data?.error || error.response?.data?.message || IF_ERROR_PERSISTS,
        };
    }
};

// Save label styles
export const saveLabelStylesAPI = async (styles) => {
    try {
        const response = await api.post("/api/layer-styles/label-styles", { styles });
        
        return {
            data: response.data,
        };
    } catch (error) {
        console.error('Save label styles API error:', {
            status: error.response?.status,
            statusText: error.response?.statusText,
            data: error.response?.data,
            message: error.message,
            fullError: error
        });
        return {
            error: error.response?.data?.error || error.response?.data?.message || error.message || IF_ERROR_PERSISTS,
        };
    }
};

// Update specific label style
export const updateLabelStyleAPI = async (layerId, styleData) => {
    try {
        const response = await api.put(`/api/layer-styles/label-styles/${layerId}`, styleData);
        
        return {
            data: response.data,
        };
    } catch (error) {
        console.error('Update label style API error:', error.response?.data || error);
        return {
            error: error.response?.data?.error || error.response?.data?.message || IF_ERROR_PERSISTS,
        };
    }
};

// Reset label styles to defaults
export const resetLabelStylesAPI = async () => {
    try {
        const response = await api.delete("/api/layer-styles/label-styles");
        
        return {
            data: response.data,
        };
    } catch (error) {
        console.error('Reset label styles API error:', error.response?.data || error);
        return {
            error: error.response?.data?.error || error.response?.data?.message || IF_ERROR_PERSISTS,
        };
    }
};