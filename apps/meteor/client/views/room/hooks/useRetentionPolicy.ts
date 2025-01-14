import type { IRoom, IRoomWithRetentionPolicy } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

const hasRetentionPolicy = (room: IRoom & { retention?: any }): room is IRoomWithRetentionPolicy =>
	'retention' in room && room.retention !== undefined;

type RetentionPolicySettings = {
	enabled: boolean;
	filesOnly: boolean;
	doNotPrunePinned: boolean;
	appliesToChannels: boolean;
	maxAgeChannels: number;
	appliesToGroups: boolean;
	maxAgeGroups: number;
	appliesToDMs: boolean;
	maxAgeDMs: number;
};

export const getMaxAgeInMS = (maxAge: number) => maxAge * 24 * 60 * 60 * 1000;

const isActive = (room: IRoom, { enabled, appliesToChannels, appliesToGroups, appliesToDMs }: RetentionPolicySettings): boolean => {
	if (!enabled) {
		return false;
	}

	if (hasRetentionPolicy(room) && room.retention.enabled !== undefined) {
		return room.retention.enabled;
	}

	switch (room.t) {
		case 'c':
			return appliesToChannels;
		case 'p':
			return appliesToGroups;
		case 'd':
			return appliesToDMs;
	}

	return false;
};

const extractFilesOnly = (room: IRoom, { filesOnly }: RetentionPolicySettings): boolean => {
	if (hasRetentionPolicy(room) && room.retention.overrideGlobal) {
		return room.retention.filesOnly;
	}

	return filesOnly;
};

const extractExcludePinned = (room: IRoom, { doNotPrunePinned }: RetentionPolicySettings): boolean => {
	if (hasRetentionPolicy(room) && room.retention.overrideGlobal) {
		return room.retention.excludePinned;
	}

	return doNotPrunePinned;
};

const getMaxAge = (room: IRoom, { maxAgeChannels, maxAgeGroups, maxAgeDMs }: RetentionPolicySettings): number => {
	if (hasRetentionPolicy(room) && room.retention.overrideGlobal) {
		return room.retention.maxAge;
	}

	if (room.t === 'c') {
		return maxAgeChannels;
	}
	if (room.t === 'p') {
		return maxAgeGroups;
	}
	if (room.t === 'd') {
		return maxAgeDMs;
	}

	return -Infinity;
};

export const useRetentionPolicy = (
	room: IRoom | undefined,
):
	| {
			enabled: boolean;
			isActive: boolean;
			filesOnly: boolean;
			excludePinned: boolean;
			maxAge: number;
	  }
	| undefined => {
	const settings = {
		enabled: useSetting('RetentionPolicy_Enabled') as boolean,
		filesOnly: useSetting('RetentionPolicy_FilesOnly') as boolean,
		doNotPrunePinned: useSetting('RetentionPolicy_DoNotPrunePinned') as boolean,
		appliesToChannels: useSetting('RetentionPolicy_AppliesToChannels') as boolean,
		maxAgeChannels: useSetting('RetentionPolicy_MaxAge_Channels') as number,
		appliesToGroups: useSetting('RetentionPolicy_AppliesToGroups') as boolean,
		maxAgeGroups: useSetting('RetentionPolicy_MaxAge_Groups') as number,
		appliesToDMs: useSetting('RetentionPolicy_AppliesToDMs') as boolean,
		maxAgeDMs: useSetting('RetentionPolicy_MaxAge_DMs') as number,
	} as const;

	if (!room) {
		return undefined;
	}

	return {
		enabled: settings.enabled,
		isActive: isActive(room, settings),
		filesOnly: extractFilesOnly(room, settings),
		excludePinned: extractExcludePinned(room, settings),
		maxAge: getMaxAge(room, settings),
	};
};
