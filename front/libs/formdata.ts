type Primitive = string | number | boolean | null | undefined;
type FormDataValue = Primitive | Blob | Array<Primitive | Blob>;
type FormDataMap<T extends object> = Partial<
    Record<keyof T, (value: unknown) => FormDataValue>
>;

export function appendFd(fd: FormData, key: string, value: Primitive) {
    if (value === undefined || value === null) return;
    fd.append(key, String(value));
}

export function toFormData<T extends object>(
    data: T,
    opts?: {
        omit?: string[];
        map?: FormDataMap<T>;
    }
) {
    const fd = new FormData();
    const omit = new Set(opts?.omit ?? []);

    for (const [k, raw] of Object.entries(data)) {
        if (omit.has(k)) continue;

        const key = k as keyof T;
        const mapped = opts?.map?.[key] ? opts.map[key]!(raw) : raw;

        if (mapped === undefined || mapped === null) continue;

        if (Array.isArray(mapped)) {
            mapped.forEach((item) => {
                if (item === undefined || item === null) return;
                if (item instanceof Blob) fd.append(String(k), item);
                else fd.append(String(k), String(item));
            });
            continue;
        }

        if (mapped instanceof Blob) {
            fd.append(String(k), mapped);
            continue;
        }

        fd.append(String(k), String(mapped));
    }

    return fd;
}
