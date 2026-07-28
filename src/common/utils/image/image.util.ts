import { SojebStorage } from 'src/common/lib/Disk/SojebStorage';
import appConfig from 'src/config/app.config';

type ImageStorageFolder = keyof ReturnType<typeof appConfig>['storageUrl'];

export class ImageGetUtil {
	private static normalize(segment: string): string {
		return segment.replace(/^\/+|\/+$/g, '');
	}

	private static folderPath(folder: ImageStorageFolder | string): string {
		const storageUrl = appConfig().storageUrl as Record<string, string>;
		const resolvedFolder = storageUrl[folder] ?? folder;
		return this.normalize(resolvedFolder);
	}

	public static key(
		folder: ImageStorageFolder | string,
		fileName?: string | null,
	): string | null {
		if (!fileName) {
			return null;
		}

		return `${this.folderPath(folder)}/${this.normalize(fileName)}`;
	}

	public static getUrl(
		folder: ImageStorageFolder | string,
		fileName?: string | null,
	): string | null {
		const key = this.key(folder, fileName);
		return key ? SojebStorage.url(key) : null;
	}

	public static avatarUrl(fileName?: string | null): string | null {
		return this.getUrl('avatar', fileName);
	}

	public static portfolioUrl(fileName?: string | null): string | null {
		return this.getUrl('portfolio', fileName);
	}

	public static jobPhotoUrl(fileName?: string | null): string | null {
		return this.getUrl('jobPhoto', fileName);
	}

	public static attachmentUrl(fileName?: string | null): string | null {
		return this.getUrl('attachment', fileName);
	}

	public static websiteInfoUrl(fileName?: string | null): string | null {
		return this.getUrl('websiteInfo', fileName);
	}

	public static avatar(fileName?: string | null): string | null {
		return this.avatarUrl(fileName);
	}

	public static portfolio(fileName?: string | null): string | null {
		return this.portfolioUrl(fileName);
	}

	public static jobPhoto(fileName?: string | null): string | null {
		return this.jobPhotoUrl(fileName);
	}

	public static attachment(fileName?: string | null): string | null {
		return this.attachmentUrl(fileName);
	}

	public static websiteInfo(fileName?: string | null): string | null {
		return this.websiteInfoUrl(fileName);
	}
}