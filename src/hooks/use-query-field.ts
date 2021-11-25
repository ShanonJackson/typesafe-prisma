import { useRouter } from "next/router";

export const useQueryField = {
	number: (field: string): number | undefined => {
		const router = useRouter();
		const atField = router.query[field];
		return atField ? +atField : undefined;
	},
};
