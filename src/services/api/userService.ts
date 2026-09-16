import { apiClient } from './client';
import { Address, User } from '../../types/auth';

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  phone?: string;
  addresses?: Address[];
  password?: string;
}

export const userService = {
  /**
   * Fetch authenticated user's profile from database
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.post<{ success: boolean; user: User }>('/user/profile/get');
    return response.data.user;
  },

  /**
   * Update authenticated user's profile details or addresses
   */
  async updateProfile(payload: UpdateProfilePayload): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{ success: boolean; message: string }>('/user/profile/update', payload);
    return response.data;
  },

  /**
   * Save or update a single address in the user's addresses array
   */
  async saveAddress(address: Address): Promise<{ success: boolean; message: string }> {
    const currentProfile = await this.getProfile();
    let addresses = currentProfile.addresses ? [...currentProfile.addresses] : [];

    // If new address is set to default, unset other defaults
    if (address.isDefault) {
      addresses = addresses.map((addr) => ({ ...addr, isDefault: false }));
    }

    const existingIndex = addresses.findIndex((a) => a.id === address.id);
    if (existingIndex > -1) {
      addresses[existingIndex] = address;
    } else {
      addresses.push(address);
    }

    return this.updateProfile({ addresses });
  },

  /**
   * Delete an address by ID
   */
  async deleteAddress(addressId: string): Promise<{ success: boolean; message: string }> {
    const currentProfile = await this.getProfile();
    const addresses = (currentProfile.addresses || []).filter((a) => a.id !== addressId);
    return this.updateProfile({ addresses });
  },

  /**
   * Toggle product in user's wishlist
   */
  async toggleWishlist(productId: string): Promise<string[]> {
    const response = await apiClient.post<{ success: boolean; wishlist: string[] }>('/user/wishlist/toggle', {
      productId,
    });
    return response.data.wishlist;
  },
};

export default userService;
